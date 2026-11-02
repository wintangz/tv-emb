"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

export interface ParsedOption {
  value: string;
  label: React.ReactNode;
  textLabel: string;
  leadingIcon: string | null;
  cleanText: string;
  disabled?: boolean;
}

export interface ModernSelectProps {
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
  title?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  variant?: "default" | "ghost";
}

const LEADING_ICON_PATTERN =
  /^([\p{Emoji_Presentation}\p{Extended_Pictographic}👑📋🎨⚙📄🖨⬇🧮📦💵💰⚠✓✎🛡✿★🔍📊❖♟⌇✦💾☰⊞↺])\uFE0F?\s+(.+)$/u;

function splitLeadingIcon(raw: string): {
  leadingIcon: string | null;
  cleanText: string;
} {
  const match = raw.match(LEADING_ICON_PATTERN);
  if (!match) {
    return { leadingIcon: null, cleanText: raw };
  }
  return {
    leadingIcon: match[1],
    cleanText: match[2].trim(),
  };
}

function flattenText(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") {
    return "";
  }
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(flattenText).join("");
  }
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return flattenText(node.props.children);
  }
  return "";
}

function extractOptions(children: React.ReactNode): ParsedOption[] {
  const result: ParsedOption[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;

    if (child.type === React.Fragment) {
      const fragProps = child.props as { children?: React.ReactNode };
      result.push(...extractOptions(fragProps.children));
      return;
    }

    if (child.type === "option") {
      const optProps = child.props as {
        value?: string | number;
        disabled?: boolean;
        children?: React.ReactNode;
      };
      const textLabel = flattenText(optProps.children).trim();
      const { leadingIcon, cleanText } = splitLeadingIcon(textLabel);
      const val =
        optProps.value !== undefined ? String(optProps.value) : textLabel;
      result.push({
        value: val,
        label: optProps.children,
        textLabel,
        leadingIcon,
        cleanText,
        disabled: optProps.disabled,
      });
    }
  });

  return result;
}

function renderOptionContent(opt: ParsedOption) {
  if (opt.leadingIcon) {
    return (
      <span className="inline-flex min-w-0 items-center gap-2">
        <span
          aria-hidden="true"
          className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-[13px] leading-none"
        >
          {opt.leadingIcon}
        </span>
        <span className="truncate leading-snug">{opt.cleanText}</span>
      </span>
    );
  }
  return <span className="truncate leading-snug">{opt.label}</span>;
}

export default function ModernSelect({
  value,
  defaultValue,
  onChange,
  className = "",
  title,
  disabled = false,
  children,
  variant = "default",
}: ModernSelectProps) {
  const listboxId = useId();
  const options = useMemo(() => extractOptions(children), [children]);

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string>(() => {
    if (value !== undefined) return String(value);
    if (defaultValue !== undefined) return String(defaultValue);
    return options[0]?.value ?? "";
  });

  const currentValue = isControlled ? String(value) : internalValue;

  const selectedOption = useMemo<ParsedOption>(
    () =>
      options.find((o) => o.value === currentValue) ??
      options[0] ?? {
        value: "",
        label: "",
        textLabel: "",
        leadingIcon: null,
        cleanText: "",
      },
    [options, currentValue],
  );

  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    openUpward: boolean;
  }>({
    top: 0,
    left: 0,
    width: 180,
    openUpward: false,
  });

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const estimatedHeight = Math.min(options.length * 40 + 18, 290);
    const openUpward = spaceBelow < estimatedHeight && rect.top > spaceBelow;

    setCoords({
      top: openUpward ? rect.top - 6 : rect.bottom + 6,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)),
      width: Math.max(rect.width, 176),
      openUpward,
    });
  }, [options.length]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    function handleOutsideMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    function handleScrollOrResize(e: Event) {
      if (
        menuRef.current &&
        e.target instanceof Node &&
        menuRef.current.contains(e.target)
      ) {
        return;
      }
      updatePosition();
    }

    window.addEventListener("mousedown", handleOutsideMouseDown);
    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("scroll", handleScrollOrResize, true);
    return () => {
      window.removeEventListener("mousedown", handleOutsideMouseDown);
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("scroll", handleScrollOrResize, true);
    };
  }, [open, updatePosition]);

  const handleSelectValue = useCallback(
    (nextVal: string) => {
      if (!isControlled) {
        setInternalValue(nextVal);
      }
      setOpen(false);
      if (onChange) {
        const syntheticEvent = {
          target: { value: nextVal },
          currentTarget: { value: nextVal },
          preventDefault: () => {},
          stopPropagation: () => {},
        } as unknown as React.ChangeEvent<HTMLSelectElement>;
        onChange(syntheticEvent);
      }
      triggerRef.current?.focus();
    },
    [isControlled, onChange],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (!open) {
      if (
        e.key === "ArrowDown" ||
        e.key === "ArrowUp" ||
        e.key === "Enter" ||
        e.key === " "
      ) {
        e.preventDefault();
        const currentIdx = Math.max(
          0,
          options.findIndex((o) => o.value === currentValue),
        );
        setHighlightedIndex(currentIdx);
        setOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % Math.max(1, options.length));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(
        (prev) => (prev - 1 + options.length) % Math.max(1, options.length),
      );
      return;
    }

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const chosen = options[highlightedIndex];
      if (chosen && !chosen.disabled) {
        handleSelectValue(chosen.value);
      }
      return;
    }

    if (e.key === "Tab") {
      setOpen(false);
    }
  };

  const isFullWidth = className.includes("w-full");

  return (
    <div
      className={`relative ${isFullWidth ? "block w-full" : "inline-block"}`}
    >
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        title={title}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={() => {
          if (disabled) return;
          if (!open) {
            const idx = Math.max(
              0,
              options.findIndex((o) => o.value === currentValue),
            );
            setHighlightedIndex(idx);
          }
          setOpen((prev) => !prev);
        }}
        onKeyDown={handleKeyDown}
        className={`group inline-flex items-center justify-between gap-2.5 text-left transition-all duration-150 select-none cursor-pointer ${
          variant === "ghost"
            ? "tv-modern-select-ghost rounded-xl px-3 py-1.5 text-xs font-bold tv-text"
            : "tv-modern-select-trigger rounded-xl px-3.5 py-2 text-xs font-medium tv-text"
        } ${open ? "ring-2 ring-(--tv-accent)/35 border-(--tv-accent)" : ""} ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        } ${className}`}
      >
        {renderOptionContent(selectedOption)}
        <svg
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 tv-text-muted transition-transform duration-200 group-hover:text-(--tv-accent) ${
            open ? "rotate-180 text-(--tv-accent)" : ""
          }`}
        >
          <path
            d="M5.5 7.75L10 12.25L14.5 7.75"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            id={listboxId}
            role="listbox"
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              minWidth: coords.width,
              maxWidth: "min(440px, 92vw)",
              transform: coords.openUpward ? "translateY(-100%)" : undefined,
              zIndex: 9999,
            }}
            className="tv-modern-select-menu max-h-72 overflow-y-auto rounded-2xl p-1.5 space-y-0.5 text-xs shadow-2xl"
          >
            {options.map((opt, idx) => {
              const isSelected = opt.value === currentValue;
              const isHighlighted = idx === highlightedIndex;
              return (
                <button
                  key={`${opt.value}-${idx}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={opt.disabled}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onClick={() => {
                    if (!opt.disabled) {
                      handleSelectValue(opt.value);
                    }
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors duration-100 cursor-pointer ${
                    isSelected
                      ? "tv-modern-select-option-active font-bold"
                      : isHighlighted
                        ? "tv-modern-select-option-hover tv-text"
                        : "tv-modern-select-option tv-text"
                  } ${opt.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  {renderOptionContent(opt)}
                  {isSelected && (
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 tv-accent-text"
                    >
                      <path
                        d="M4.5 10.5L8.25 14.25L15.5 6.75"
                        stroke="currentColor"
                        strokeWidth="2.1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}
