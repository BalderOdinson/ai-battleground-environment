import importlib
from django.db import models
from connect.models import Connection
from django.core.exceptions import ObjectDoesNotExist

from gql import gql, Client
from gql.transport.requests import RequestsHTTPTransport

from game.query import ALLOCATE_WORKGROUP
from game.env import Environment


class WorkgroupStatus(models.IntegerChoices):
    BUSY = 0
    AVAILABLE = 1


class Workgroup(models.Model):
    worker_id = models.CharField(max_length=24, unique=True)
    status = models.IntegerField('workgroup status', default=WorkgroupStatus.BUSY)

    @staticmethod
    def allocate_workgroup(worker_id: str) -> status:
        status, connection = Connection.get_connection()
        if status != 200:
            return status
        http_transport = RequestsHTTPTransport(
            url=connection.http_server_url,
            headers={'Authorization': connection.server_private_key},
            verify=False,
            retries=3
        )

        with Client(transport=http_transport,
                    fetch_schema_from_transport=True) as session:
            session.execute(gql(ALLOCATE_WORKGROUP(worker_id)))

        try:
            workgroup = Workgroup.objects.get(worker_id=worker_id)
            if workgroup.status == WorkgroupStatus.BUSY:
                return 400
            workgroup.status = WorkgroupStatus.BUSY
            workgroup.save()
        except ObjectDoesNotExist:
            Workgroup(worker_id=worker_id).save()

        return 200

    @staticmethod
    def free_workgroup(worker_id: str) -> status:
        try:
            workgroup = Workgroup.objects.get(worker_id=worker_id)
            if workgroup.status == WorkgroupStatus.AVAILABLE:
                return 400
            workgroup.status = WorkgroupStatus.AVAILABLE
            workgroup.save()
        except ObjectDoesNotExist:
            return 404

        return 200

    @staticmethod
    def work(script: str, class_name: str, method_name: str, args: dict):
        module = importlib.import_module(f'scripts.{script}')
        Script = getattr(module, class_name)
        script = Script()
        getattr(script, method_name)(**args)

    @staticmethod
    def game(script: str, class_name: str, args: dict) -> status:
        status, connection = Connection.get_connection()
        if status != 200:
            return status
        env = Environment(connection.http_server_url)
        module = importlib.import_module(f'scripts.{script}')
        Agent = getattr(module, class_name)
        agent = Agent()
        env.play(agent, **args)
