from django.http import HttpRequest, JsonResponse
from .models import Connection


def step1(request: HttpRequest):
    status, result = Connection.step1(request)
    return JsonResponse(result, status=status)


def step2(request: HttpRequest):
    status, result = Connection.step2(request)
    return JsonResponse(result, status=status)


def check(request: HttpRequest):
    status, connection = Connection.get_connection()
    return JsonResponse({
        'key': connection.server_private_key,
        'ip': connection.http_server_url
    }, status=status)
