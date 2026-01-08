import { UserModel, type IUser } from "../models/User";
import type mongoose from "mongoose";

export function existsUser(userId: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    UserModel.exists({ _id: userId }).then((res) => {
      resolve(!!res);
    }).catch(reject);
  });
}

export function setUserSchedule(userId: string, schedules: NonNullable<IUser["d_day"]>["schedules"]) {
  return UserModel.findOneAndUpdate({ _id: userId }, {
    d_day: {
      schedules: schedules
    }
  }, { new: true });
}

export function getUser(userId: string): Promise<IUser | null>;
export function getUser(userId: string, data: (keyof IUser)[]): Promise<Pick<IUser, Extract<keyof IUser, typeof data[number]>> | null>;
export function getUser(userId: string, data: "d_day"): Promise<IUser["d_day"] | null>;
export function getUser(userId: string, data: "school"): Promise<IUser["school"] | null>;
export function getUser(userId: string, data: keyof IUser): Promise<IUser[typeof data] | null>;
export function getUser(userId: string, data?: keyof IUser | (keyof IUser)[]) {
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

      UserModel.aggregate([
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
      UserModel.findById({ _id: userId }).then(resolve).catch(reject);
    }
  });
}