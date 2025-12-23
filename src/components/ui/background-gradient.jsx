import { cn } from "../../lib/utils";
import React from "react";

export const BackgroundGradient = ({
  children,
  className,
  containerClassName,
  animate = true,
}) => {
  const variants = {
    initial: {
      backgroundPosition: "0 50%",
    },
    animate: {
      backgroundPosition: ["0, 50%", "100% 50%", "0 50%"],
    },
  };
  return (
    <div className={cn("relative p-[4px] group", containerClassName)}>
      <div
        className={cn(
          "absolute inset-0 rounded-3xl z-[1] opacity-60 group-hover:opacity-100 blur-xl  transition duration-500 will-change-transform",
          " bg-[radial-gradient(circle_farthest-side_at_0_100%,#4caf50,transparent),radial-gradient(circle_farthest-side_at_100%_0,#6d7c00,transparent),radial-gradient(circle_farthest-side_at_100%_100%,#4caf50,transparent),radial-gradient(circle_farthest-side_at_0_0,#6d7c00,#4caf50)]"
        )}
      />
      <div
        className={cn(
          "relative z-10 bg-white dark:bg-zinc-900 rounded-[22px]",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
};
