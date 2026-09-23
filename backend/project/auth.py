@auth.route('/api/auth/logout', methods=['POST'])
def api_logout():
    logout_user()
    response = jsonify({'success': True})
    response.delete_cookie('session')
    return response, 200