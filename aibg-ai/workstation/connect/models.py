from __future__ import annotations
import os
import json
from django.db import models
from django.utils import timezone
from django.http import HttpRequest
from ipware import get_client_ip
from typing import Tuple


class Connection(models.Model):
    server_private_key = models.CharField(max_length=24)
    http_server_url = models.CharField(max_length=23, null=True)
    ws_server_url = models.CharField(max_length=21, null=True)
    date = models.DateTimeField('date', default=timezone.now)

    @staticmethod
    def step1(request: HttpRequest) -> Tuple[int, dict]:
        key = request.headers.get('Authorization')
        if key == os.getenv('AI_PUBLIC_KEY'):
            return (200, {
                "PUBLIC_KEY": os.getenv('SERVER_PUBLIC_KEY'),
                "PRIVATE_KEY": os.getenv('AI_PRIVATE_KEY')
            })
        else:
            return 401, {}

    @staticmethod
    def step2(request: HttpRequest) -> Tuple[int, dict]:
        key = request.headers.get('Authorization')
        if key == os.getenv('AI_PRIVATE_KEY'):
            payload = json.loads(request.body)
            server_key = payload['PRIVATE_KEY']
            ip, is_routable = get_client_ip(request)
            Connection(
                server_private_key=server_key,
                http_server_url=f'http://{ip}:4000',
                ws_server_url=f'ws://{ip}:4000',
            ).save()
            return (200, {
                "message": "success"
            })
        else:
            return 401, {}

    @staticmethod
    def get_connection() -> Tuple[int, Connection or None]:
        connections = Connection.objects.order_by('-date')[:1]
        if len(connections) == 0:
            return 404, None
        return 200, connections[0]

    @staticmethod
    def authorize(request: HttpRequest) -> bool:
        return request.headers.get('Authorization') == os.getenv('AI_PRIVATE_KEY')

    def __str__(self):
        return self.server_private_key
