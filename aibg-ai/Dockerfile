FROM tensorflow/tensorflow:latest-gpu-py3

RUN add-apt-repository ppa:deadsnakes/ppa -y
RUN apt update && apt-get install python3.7 -y
RUN update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.7 2

RUN python3 -m pip install pip -U
RUN python3 -m pip install pandas Pillow requests matplotlib numpy
RUN python3 -m pip install --pre gql
RUN python3 -m pip install flask asyncio

EXPOSE 5000

WORKDIR /usr/app/

COPY . .

ENV FLASK_APP server

CMD ["python3", "-m", "flask", "run", "--host=0.0.0.0"]
