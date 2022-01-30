import { ReactNode } from "react";

type Props = {
  title?: string;
};

export default function Footer({ title }: Props) {
  return (
    <div className="p-5">
      <div className="flex justify-between items-center bg-gradient-to-r from-purple-500 to-pink-500  p-5 shadow-lg rounded-lg">
        <h1 className="text-2xl text-red-50 ">{title}</h1>
      </div>
    </div>
  );
}
