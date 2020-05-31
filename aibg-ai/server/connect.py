from flask import (
    Blueprint, abort, request, current_app
)
import os

bp = Blueprint('connect', __name__, url_prefix='/connect')


@bp.route('/step1', methods=['GET'])
def connect_step1():
    key = request.headers.get('Authorization')
    if key == os.getenv('AI_PUBLIC_KEY'):
        return {
            "PUBLIC_KEY": os.getenv('SERVER_PUBLIC_KEY'),
            "PRIVATE_KEY": os.getenv('AI_PRIVATE_KEY')
        }
    else:
        abort(401)


@bp.route('/step2', methods=['POST'])
def connect_step2():
    key = request.headers.get('Authorization')
    if key == os.getenv('AI_PRIVATE_KEY'):
        payload = request.get_json()
        current_app.config['SERVER_PRIVATE_KEY'] = payload['PRIVATE_KEY']
        return {
            "message": "success"
        }
    else:
        abort(401)
