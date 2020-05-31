import importlib
import os

from flask import (
    Blueprint, abort, request, current_app
)
from gql import gql, Client
from gql.transport.requests import RequestsHTTPTransport

from . import auth
from .query import ALLOCATE_WORKGROUP

bp = Blueprint('workgroups', __name__, url_prefix='/workgroups')


def allocate_workgroup(worker_id, private_key):
    http_transport = RequestsHTTPTransport(
        url=os.getenv("HTTP_SERVER_URL"),
        headers={'Authorization': private_key},
        verify=False,
        retries=3
    )

    with Client(transport=http_transport,
                fetch_schema_from_transport=True) as session:
        session.execute(gql(ALLOCATE_WORKGROUP(worker_id)))


def work(script, class_name, method_name, args):
    module = importlib.import_module(f'server.scripts.{script}')
    Script = getattr(module, class_name)
    script = Script()
    getattr(script, method_name)(**args)


@bp.route('/schedule', methods=['POST'])
def schedule():
    if not auth.authorize(request):
        abort(401)

    try:
        payload = request.get_json()
        worker_id = payload['worker_id']
        script = payload['script']
        class_name = payload['className']
        method_name = payload['methodName']
        args = payload['args']
        allocate_workgroup(worker_id, current_app.config['SERVER_PRIVATE_KEY'])
        work(script, class_name, method_name, args)
        return {
            "message": "success"
        }
    except ValueError as err:
        abort(400, err)


def gameWork(env, script, class_name, args):
    module = importlib.import_module(f'server.scripts.{script}')
    Agent = getattr(module, class_name)
    agent = Agent()
    env.play(agent, **args)


@bp.route('/scheduleGame', methods=['POST'])
def schedule_game():
    if not auth.authorize(request):
        abort(401)

    try:
        payload = request.get_json()
        worker_id = payload['worker_id']
        script = payload['script']
        class_name = payload['className']
        args = payload['args']
        allocate_workgroup(worker_id, current_app.config['SERVER_PRIVATE_KEY'])
        gameWork(current_app.config['GAME_ENVIRONMENT'],
                 script, class_name, args)
        return {
            "message": "success"
        }
    except ValueError as err:
        abort(400, err)
