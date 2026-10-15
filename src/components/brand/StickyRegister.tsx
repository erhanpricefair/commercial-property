"use client";

import { useEffect, useState } from "react";

/**
 * Phone-only bar that keeps "Register Your Interest" within reach — and gets
 * out of the way while the form itself (or the top of the page, which has its
 * own buttons) is on screen.
 */
export default function StickyRegister({ label }: { label: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const register = document.getElementById("register");
    const hero = document.getElementById("top");
    if (!register || !hero || !("IntersectionObserver" in window)) return;
    const visible = new Map<Element, boolean>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) visible.set(entry.target, entry.isIntersecting);
      setShow(!visible.get(register) && !visible.get(hero));
    });
    observer.observe(register);
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-charcoal/15 bg-ivory/95 p-3 backdrop-blur transition-transform duration-300 sm:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!show}
    >
      <a href="#register" tabIndex={show ? 0 : -1} className="nf-btn-primary w-full">
        {label} <span aria-hidden="true">→</span>
      </a>
    </div>
  );
}
