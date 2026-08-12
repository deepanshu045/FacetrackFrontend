import { ReactNode } from "react";
import { motion } from "motion/react";

interface PageWrapProps {
  children: ReactNode;
}

export default function PageWrap({
  children,
}: PageWrapProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {children}
    </motion.div>
  );
}