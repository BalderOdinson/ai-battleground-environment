## AIBG v5.0

### Model

Link na model i podatke korštene za nadzirano učenje:
https://drive.google.com/open?id=1ip2nof7bt900ay4yrDmGH391vKFwcUOS

Raspakirati mape data i models u mapu gdje se nalaze skripte

### Skripte
```
basic_agents.py - implementacije osnovnih agenata
```   

```
brainer_layers.py - custom layeri korišteni u mreži
```

```
data_processor.py - skripta za učitavanje podataka za nadzirano učenje
```

```
data_recorder.py - skripta za spremanje podataka za nadzirano učenje
```

```
game.py - osnovni interfaceovi za igranje igre
```

```
NKBot.py - copy-paste ove loše skripte (implementacija agenta koji se koristi se nalazi u skripti basic_agents.py)
```

```
run_script.py - pokretanje igre sa zadanim agentima (server aplikacija mora bit pokrenuta).
```

```
supervised_agent.py - agent naučen na skupu podataka (trenutna verzija v3 - skripta train_supervised_agent_v1.py)
```

```
train_supervised_agent_v1.py - treniranje nadiziranog agenta (trenutna verzija v3).
```

```
train_supervised_agent_v2.py - treniranje nadiziranog agenta s fully connected ulaznim slojem (ne koristi se)
```

Ostale skripte se više ne koriste, ali su tu ako nesto zatreba od prije.

### Biblioteke

Korištene biblioteke se nalaze u requirements.txt. Instalacija s pip3:

```
pip3 install -r requirements.txt
```
 