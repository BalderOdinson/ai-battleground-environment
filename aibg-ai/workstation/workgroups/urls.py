from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from . import views

urlpatterns = [
    path('schedule', csrf_exempt(views.schedule), name='schedule'),
    path('scheduleGame', csrf_exempt(views.schedule_game), name='schedule_game'),
]