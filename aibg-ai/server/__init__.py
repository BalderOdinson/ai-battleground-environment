import os

from flask import Flask

from . import connect, workgroups
from .scripts.game import Environment


def create_app():
    app = Flask(__name__)

    app.config.from_mapping(
        SERVER_PRIVATE_KEY=None,
        GAME_ENVIRONMENT=Environment(os.getenv("HTTP_SERVER_URL"))
    )
    app.register_blueprint(connect.bp)
    app.register_blueprint(workgroups.bp)

    return app
