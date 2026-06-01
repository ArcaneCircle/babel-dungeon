import styles from "./PixelatedImgIcon.module.css";

interface Props {
  [key: string]: any;
}

export default function PixelatedImgIcon(props: Props) {
  return (
    <img
      className={styles.pixelated}
      draggable={false}
      onContextMenu={(e) => e.preventDefault()}
      {...props}
    />
  );
}
