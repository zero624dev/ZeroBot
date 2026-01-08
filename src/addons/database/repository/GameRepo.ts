import { GameModel, type IGame } from '../models/Game';
import type mongoose from 'mongoose';

export function getRankedUsersByWallet(limit: number, skip: number) {
  return new Promise<{
    users: {
      id: string;
      // username: string;
      wallet: number;
    }[];
    count: number;
  }>((resolve, reject) => {
    GameModel.countDocuments({}).then((count) => {
      GameModel.aggregate([
        {
          $sort: { wallet: -1 }
        },
        {
          $limit: limit
        },
        {
          $skip: skip
        },
        {
          $project: {
            _id: 0, id: "$_id", wallet: 1
          }
        }
      ]).then(async (users) => {
        // await this.setUsername(users);
        resolve({
          users: users,
          count: count
        });
      }).catch(reject);
    }).catch(reject);
  });
}

export function addUserInventory(userId: string, item: string, amount: number, upsert = false) {
  return new Promise((resolve, reject) => {
    GameModel.findOneAndUpdate({ "_id": userId, "inventory.id": item }, {
      $inc: {
        "inventory.$.count": amount
      }
    }).then((res) => {
      if (!res) {
        GameModel.findOneAndUpdate({ _id: userId }, {
          $push: {
            inventory: {
              id: item,
              count: amount
            }
          }
        }, { upsert: upsert }).then(resolve).catch(reject);
      } else {
        resolve(res);
      }
    }).catch(reject);
  });
}

export function subtractUserInventory(userId: string, item: string, count: number): Promise<number> {
  return new Promise((resolve, reject) => {
    GameModel.aggregate([
      {
        $match: {
          _id: userId
        }
      },
      {
        $unwind: "$inventory"
      },
      {
        $match: {
          "inventory.id": item
        }
      },
      {
        $project: {
          _id: 0,
          count: "$inventory.count"
        }
      }
    ]).then(async ([res]) => {
      if (!res?.count) {
        return resolve(0);
      }

      const resultCount = Math.max(res.count - count, 0);

      if (resultCount == 0) {
        GameModel.findOneAndUpdate({ _id: userId }, {
          $pull: {
            inventory: {
              id: item
            }
          }
        }).then(() => {
          return resolve(res.count);
        }).catch(reject);
      } else {
        GameModel.findOneAndUpdate({ "_id": userId, "inventory.id": item }, {
          $set: {
            "inventory.$.count": resultCount
          }
        }).then(() => {
          return resolve(count);
        }).catch(reject);
      }
    }).catch(reject);
  });
}

export function hasUserInventory(userId: string, item: string) {
  return new Promise<number>((resolve, reject) => {
    GameModel.aggregate([
      {
        $match: {
          _id: userId
        }
      },
      {
        $unwind: "$inventory"
      },
      {
        $match: {
          "inventory.id": item
        }
      },
      {
        $project: {
          _id: 0,
          count: "$inventory.count",
        }
      }
    ]).then(([res]) => {
      return resolve(res?.count ?? 0);
    }).catch(reject);
  });
}

export function addUserWallet(userId: string, amount: number, upsert = false) {
  return new Promise((resolve, reject) => {
    GameModel.updateOne({ _id: userId }, { $inc: { wallet: amount } }, { upsert: upsert }).then(resolve).catch(reject);
  });
}

export function subtractUserWallet(userId: string, amount: number, upsert = false) {
  return new Promise((resolve, reject) => {
    GameModel.updateOne({ _id: userId }, { $inc: { wallet: -amount } }, { upsert: upsert }).then(resolve).catch(reject);
  });
}

export function getUser(userId: string): Promise<IGame | null>;
export function getUser(userId: string, data: (keyof IGame)[]): Promise<Pick<IGame, Extract<keyof IGame, typeof data[number]>> | null>;
export function getUser(userId: string, data: "wallet"): Promise<IGame["wallet"] | null>;
export function getUser(userId: string, data: "inventory"): Promise<IGame["inventory"] | null>;
export function getUser(userId: string, data: "farm"): Promise<IGame["farm"] | null>;
export function getUser(userId: string, data: "lastVote"): Promise<IGame["lastVote"] | null>;
export function getUser(userId: string, data?: keyof IGame | (keyof IGame)[]) {
  return new Promise((resolve, reject) => {
    if (data) {
      const project: mongoose.PipelineStage.Project["$project"] = {
        _id: 0,
      };

      if (Array.isArray(data)) {
        data.forEach((key) => {
          project[key] = `$${key}`;
        });
      } else {
        project[data] = `$${data}`;
      }

      GameModel.aggregate([
        {
          $match: { _id: userId }
        },
        {
          $project: project
        }
      ]).then(([res]) => {
        if (Array.isArray(data)) {
          resolve(res);
        } else {
          resolve(res?.[data]);
        }
      }).catch(reject);
    } else {
      GameModel.findById({ _id: userId }).then(resolve).catch(reject);
    }
  });
}

export function setUser(filter: string | mongoose.FilterQuery<unknown>, data: mongoose.UpdateQuery<unknown>, upsert: boolean = false) {
  return new Promise((resolve, reject) => {
    if (typeof filter == "string") {
      filter = { _id: filter };
    }
    GameModel.updateOne(filter, data, { upsert: upsert }).then(resolve).catch(reject);
  });
}

export function existsUser(userId: string) {
  return new Promise<boolean>((resolve, reject) => {
    GameModel.exists({ _id: userId }).then((res) => {
      resolve(!!res);
    }).catch(reject);
  });
}

export * as default from "./GameRepo";
