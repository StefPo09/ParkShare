from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from flask_login import current_user
from sqlalchemy.exc import IntegrityError

from . import db
from .models import User, UserReport


reports = Blueprint('reports', __name__)
REPORT_REASONS = {
    'fraud',
    'harassment',
    'unsafe_behavior',
    'misleading_listing',
    'other',
}


def _report_payload(report):
    return {
        'id': report.id,
        'reason': report.reason,
        'details': report.details,
        'status': report.status,
        'created_at': report.created_at.isoformat() if report.created_at else None,
        'resolved_at': report.resolved_at.isoformat() if report.resolved_at else None,
        'reporter': {'id': report.reporter.id, 'name': report.reporter.name},
        'target': {
            'id': report.target.id,
            'name': report.target.name,
            'email': report.target.email,
            'valid_report_count': UserReport.query.filter_by(
                target_id=report.target_id,
                status='valid',
            ).count(),
            'is_banned': report.target.is_banned,
        },
    }


def _admin_required():
    if not current_user.is_authenticated:
        return jsonify({'error': 'Authentication required.'}), 401
    if not current_user.is_admin():
        return jsonify({'error': 'Administrator access required.'}), 403
    return None


@reports.route('/api/users/<int:target_id>/reports', methods=['POST'])
def create_user_report(target_id):
    if not current_user.is_authenticated:
        return jsonify({'error': 'authentication_required'}), 401
    if current_user.id == target_id:
        return jsonify({'error': 'cannot_report_self'}), 400

    target = db.session.get(User, target_id)
    if not target:
        return jsonify({'error': 'user_not_found'}), 404
    if target.is_banned:
        return jsonify({'error': 'account_banned'}), 409

    data = request.get_json(silent=True) or {}
    reason = str(data.get('reason') or '').strip()
    details = str(data.get('details') or '').strip()
    if reason not in REPORT_REASONS:
        return jsonify({'error': 'invalid_report_reason'}), 400
    if len(details) > 2000:
        return jsonify({'error': 'report_details_too_long'}), 400
    if UserReport.query.filter_by(reporter_id=current_user.id, target_id=target_id).first():
        return jsonify({'error': 'already_reported'}), 409

    report = UserReport(
        reporter_id=current_user.id,
        target_id=target_id,
        reason=reason,
        details=details or None,
    )
    db.session.add(report)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'already_reported'}), 409

    return jsonify({'report': _report_payload(report)}), 201


@reports.route('/api/admin/reports', methods=['GET'])
def get_reports():
    denied = _admin_required()
    if denied:
        return denied
    status = request.args.get('status', 'pending')
    if status not in {'pending', 'valid', 'rejected', 'all'}:
        return jsonify({'error': 'Invalid report status.'}), 400
    query = UserReport.query
    if status != 'all':
        query = query.filter_by(status=status)
    items = query.order_by(UserReport.created_at.asc()).all()
    return jsonify({'reports': [_report_payload(item) for item in items]}), 200


@reports.route('/api/admin/reports/<int:report_id>', methods=['PATCH'])
def resolve_report(report_id):
    denied = _admin_required()
    if denied:
        return denied
    data = request.get_json(silent=True) or {}
    decision = data.get('status')
    if decision not in {'valid', 'rejected'}:
        return jsonify({'error': 'Status must be valid or rejected.'}), 400

    report = db.session.get(UserReport, report_id)
    if not report:
        return jsonify({'error': 'Report not found.'}), 404

    target = db.session.execute(
        db.select(User).where(User.id == report.target_id).with_for_update()
    ).scalar_one_or_none()
    if not target:
        return jsonify({'error': 'User not found.'}), 404

    report = db.session.execute(
        db.select(UserReport)
        .where(UserReport.id == report_id)
        .with_for_update()
    ).scalar_one_or_none()
    if not report:
        return jsonify({'error': 'Report not found.'}), 404
    if report.status != 'pending':
        return jsonify({'error': 'This report has already been reviewed.'}), 409

    report.status = decision
    report.resolved_at = datetime.now(timezone.utc)
    if decision == 'valid':
        db.session.flush()
        valid_report_ids = db.session.execute(
            db.select(UserReport.id)
            .where(UserReport.target_id == report.target_id, UserReport.status == 'valid')
            .with_for_update()
        ).scalars().all()
        valid_report_count = len(valid_report_ids)
        if valid_report_count >= 3:
            if not target.is_banned:
                target.is_banned = True
                target.banned_at = datetime.now(timezone.utc)

    db.session.commit()
    return jsonify({'report': _report_payload(report)}), 200