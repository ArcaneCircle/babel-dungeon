import styles from "./PixelatedImgIcon.module.css";

interface Props {
  [key: string]: any;
}

export default function PixelatedImgIcon(props: Props) {
  const {
    className,
    draggable: _draggable,
    onContextMenu: _onContextMenu,
    ...safeProps
  } = props;

  return (
    <img
      className={
        className ? `${styles.pixelated} ${className}` : styles.pixelated
      }
      {...safeProps}
      draggable={false}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}
