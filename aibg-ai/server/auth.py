import os


def authorize(request):
    return request.headers.get('Authorization') == os.getenv('AI_PRIVATE_KEY')
