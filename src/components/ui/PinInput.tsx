"use client";

import { useRef, useState } from "react";

interface PinInputProps {
  onPinConfirmed: (pin: string) => void;
}

export default function PinInput({ onPinConfirmed }: PinInputProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    if (step === 1) setPin(value);
    else setConfirmPin(value);
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (pin.length !== 6) {
        setError("6자리 숫자를 입력하세요.");
        return;
      }
      setStep(2);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      if (confirmPin !== pin) {
        setError("PIN이 일치하지 않습니다.");
        setConfirmPin("");
        setTimeout(() => inputRef.current?.focus(), 100);
        return;
      }
      // PIN 최종 확인: 클라이언트에만 저장하지 않고 콜백으로만 전달
      onPinConfirmed(pin);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-center gap-4 w-full max-w-xs mx-auto"
    >
      <label className="text-lg font-semibold mb-2">
        {step === 1 ? "6자리 PIN을 입력하세요" : "다시 한 번 PIN을 입력하세요"}
      </label>
      <input
        ref={inputRef}
        type="password"
        inputMode="numeric"
        pattern="[0-9]{6}"
        maxLength={6}
        value={step === 1 ? pin : confirmPin}
        onChange={handleChange}
        className="text-center text-2xl tracking-widest border-b-2 border-gray-400 focus:border-blue-500 outline-none py-2 w-full bg-transparent"
        autoFocus
      />
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <button
        type="submit"
        className="w-full py-2 rounded bg-blue-500 text-white font-bold hover:bg-blue-600 transition"
      >
        {step === 1 ? "다음" : "확인"}
      </button>
    </form>
  );
}
