export type PickerItem = {
  key: string;
  name: string;
};

type PickerProps = {
  items: PickerItem[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
};

export default function Picker({
  items,
  value,
  onChange,
  className = "",
}: PickerProps) {
  const selected =
    items.find((item) => item.key === value)?.name ?? "";

  return (
    <details className={`picker ${className}`}>
      <summary>{selected}</summary>

      <div className="picker-menu">
        {items.map((item) => (
          <button
            key={item.key}
            className={item.key === value ? "selected" : ""}
            onClick={(event) => {
              onChange(item.key);

              event.currentTarget
                .closest("details")
                ?.removeAttribute("open");
            }}
          >
            {item.name}
          </button>
        ))}
      </div>
    </details>
  );
}