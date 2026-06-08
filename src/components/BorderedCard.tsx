import styles from "./BorderedCard.module.css";

type Props = {
  textColor: string;
  backgroundColor: string;
  innerBorderColor: string;
  outerBorderColor: string;
  children: React.ReactNode;
};

export default function BorderedCard({
  textColor,
  backgroundColor,
  innerBorderColor,
  outerBorderColor,
  children,
}: Props) {
  return (
    <div style={{ background: outerBorderColor, padding: "4px" }}>
      <div
        className={styles.card}
        style={{
          color: textColor,
          background: backgroundColor,
          ["--card-after-bg" as string]: innerBorderColor,
        }}
      >
        {children}
      </div>
    </div>
  );
}
