import json
from django.http import HttpRequest, JsonResponse
from connect.models import Connection
from .models import Workgroup


def schedule(request: HttpRequest):
    if not Connection.authorize(request):
        return JsonResponse({}, status=401)

    try:
        payload = json.loads(request.body)
        worker_id = payload['worker_id']
        script = payload['script']
        class_name = payload['className']
        method_name = payload['methodName']
        args = payload['args']
        Workgroup.allocate_workgroup(worker_id)
        Workgroup.work(script, class_name, method_name, args)
        Workgroup.free_workgroup(worker_id)
        return JsonResponse({
            "message": "success"
        })
    except ValueError as err:
        return JsonResponse(err, 400)


def schedule_game(request: HttpRequest):
    if not Connection.authorize(request):
        return JsonResponse({}, status=401)

    try:
        payload = json.loads(request.body)
        worker_id = payload['worker_id']
        script = payload['script']
        class_name = payload['className']
        args = payload['args']
        Workgroup.allocate_workgroup(worker_id)
        Workgroup.game(script, class_name, args)
        Workgroup.free_workgroup(worker_id)
        return JsonResponse({
            "message": "success"
        })
    except ValueError as err:
        return JsonResponse(err, 400)