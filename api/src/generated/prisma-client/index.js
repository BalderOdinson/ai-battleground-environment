"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var prisma_lib_1 = require("prisma-client-lib");
var typeDefs = require("./prisma-schema").typeDefs;

var models = [
  {
    name: "Agent",
    embedded: false
  },
  {
    name: "Game",
    embedded: false
  },
  {
    name: "GameMap",
    embedded: false
  },
  {
    name: "GameStatus",
    embedded: false
  },
  {
    name: "Move",
    embedded: false
  },
  {
    name: "Action",
    embedded: false
  },
  {
    name: "ActionType",
    embedded: false
  },
  {
    name: "Map",
    embedded: true
  },
  {
    name: "GameState",
    embedded: true
  },
  {
    name: "Tile",
    embedded: true
  },
  {
    name: "TileType",
    embedded: false
  },
  {
    name: "ItemType",
    embedded: false
  },
  {
    name: "Player",
    embedded: true
  },
  {
    name: "Morph",
    embedded: false
  },
  {
    name: "Workstation",
    embedded: false
  },
  {
    name: "Workgroup",
    embedded: false
  }
];
exports.Prisma = prisma_lib_1.makePrismaClientClass({
  typeDefs,
  models,
  endpoint: `http://192.168.1.6:4466`
});
exports.prisma = new exports.Prisma();
