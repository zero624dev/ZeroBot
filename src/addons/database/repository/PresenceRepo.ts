import { PresenceModel, type IPresence } from "../models/Presence";

export function getPresenceByDate(userId: string, startTime: Date, endTime: Date): Promise<{ items: IPresence[]; firstItem: IPresence[]; lastItem: IPresence[] }> {
  return new Promise((resolve, reject) => {
    PresenceModel.aggregate([
      { $match: { userId: userId } },
      {
        $facet: {
          items: [
            { $match: { timestamp: { $gte: startTime, $lte: endTime } } },
            { $sort: { timestamp: 1 } },
          ],
          firstItem: [
            { $match: { timestamp: { $lt: startTime } } },
            { $sort: { timestamp: -1 } },
            { $limit: 1 },
          ],
          lastItem: [
            { $sort: { timestamp: -1 } },
            { $limit: 1 },
          ],
        },
      },
    ]).then(([res]) => {
      resolve(res);
    }).catch(reject);
  });
}

export function getPresenceLatestDate(userId: string): Promise<Date> {
  return new Promise((resolve, reject) => {
    PresenceModel.findOne({ userId: userId }).sort({ timestamp: 1 })
      .then((res) => new Date(res!.timestamp)).then(resolve).catch(reject);
  });
}
