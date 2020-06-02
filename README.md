# AI Battleground Environment
Deep Reinforcement environment for distributed learning created in preparation for AI Battleground hackathon.


## Contents <!-- omit in toc -->

- [Introduction](#introduction)
- [Project structure](#project-structure)
  - [Backend](#backend)
  - [Frontend](#frontend)
  - [AI](#ai)
- [Current work](#current-work)
- [Future work](#future-work)

## Introduction
Goal of this project is to make an environment in which it will be easy to integrate any game that may appear on AIBG hackathon. Environment should provide fast setup of current state-of-art reinforcement learning algorithms and that they can be distributed among team computers for faster learning. It aims to create easy to use UI to schedule written algorithms in python for execution and to collect game data for training process. Current game that is integrated into platform is a game from last years AIBG where there were two bears fighting for power. 

## Project structure 

Project is devided in three components: 

### Backend

GraphQL API backend in Nodejs. Framework used for communication with MongoDB database is Prisma.

Backend provides API for playing games both human and AI, recording player moves and dispatching work on workstations.

Root folder is api/

### Frontend

ReactJs web app for easier interaction with backend API.

Root folder is client/

### AI

Python app with implementations of different AI algorithms and Flask server which will serve as API for recieveg work that should be executed.

Root folder is aibg-ai

## Current work
  - Currently all main backend functionality is implemented. 
  - UI has implemented possiblity of creating agents, workstations, scheduling game where agent fights another agent and watching games that are being played.
  - AI has some supervised models implemented that can currently only be overfitted. It also contains model for reducing input dimensionality (Autoencoder) and new map generator (Variational autoencoder) which is currently being worked on. It also contains Flask server for receiving work(games to play)
  
 ## Future work
  - Can make and play games against other player or agents inside UI. 
  - Possiblity to schedule complex distributed train algorithms through UI.
  - Create loader that will load and preprocess data from backend (Currently only available for loading from csv file).
  - Improve supervised model by making an agent based on set of rules against which human player will play to collect data. 
  - Finish map generator to have more maps available for better diversity to reduce overfitting. 
  - Implement some state-of-art reinforcement algorithms and test it with the environment.
  - Add build instructions to README.md
