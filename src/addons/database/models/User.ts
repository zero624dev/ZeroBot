import mongoose, { Schema, Document } from "mongoose";

const UserScheduleSchema: Schema = new Schema(
  {
    name: { type: Schema.Types.String, required: false },
    date: { type: Schema.Types.Number, required: true },
  },
  {
    _id: false,
    timestamps: false,
  },
);

const UserDDaySchema: Schema = new Schema(
  {
    schedules: { type: [UserScheduleSchema], required: true },
  },
  {
    _id: false,
    timestamps: false,
  },
);

const UserSchoolSchema: Schema = new Schema(
  {
    code: { type: Schema.Types.Array, length: 2, required: true },
    kind: { type: Schema.Types.String, required: true },
    grade: { type: Schema.Types.String, required: false },
    classNum: { type: Schema.Types.String, required: false },
    department: { type: Schema.Types.String, required: false },
  },
  {
    _id: false,
    timestamps: false,
  },
);

const UserSchema: Schema = new Schema(
  {
    _id: { type: Schema.Types.String, required: true },
    school: { type: UserSchoolSchema, required: false },
    d_day: { type: UserDDaySchema, required: false },
  },
  {
    _id: false,
    timestamps: true,
  },
);

export interface IUser extends Document {
  username: string;
  school?: {
    code: [string, string]; // 교육청코드, 표준학교코드
    kind: "high" | "middle" | "elementary";
    grade: number;
    classNum: number;
    department: string;
  };
  d_day?: {
    schedules: {
      name?: string;
      date: number;
    }[];
  };
}

export const UserModel = mongoose.model<IUser>("User", UserSchema);
