from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from . import views

urlpatterns = [
    path('step1', csrf_exempt(views.step1), name='step1'),
    path('step2', csrf_exempt(views.step2), name='step2'),
    path('check', csrf_exempt(views.check), name='check'),
]