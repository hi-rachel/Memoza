"use client";

import { useState } from "react";

interface PinSetKeypadProps {
  onPinConfirmed: (pin: string) => void;
}

export default function PinSetKeypad({ onPinConfirmed }: PinSetKeypadProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");

  const value = step === 1 ? pin : confirmPin;

  const handleKey = (num: string) => {
    if (value.length < 6) {
      if (step === 1) setPin(pin + num);
      else setConfirmPin(confirmPin + num);
      setError("");
    }
  };

  const handleBackspace = () => {
    if (step === 1) setPin(pin.slice(0, -1));
    else setConfirmPin(confirmPin.slice(0, -1));
    setError("");
  };

  const handleSubmit = () => {
    if (value.length !== 6) {
      setError("6자리 숫자를 입력하세요.");
      return;
    }
    if (step === 1) {
      setStep(2);
      setError("");
    } else {
      if (confirmPin !== pin) {
        setError("PIN이 일치하지 않습니다.");
        setConfirmPin("");
        setError("");
        return;
      }
      onPinConfirmed(pin);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-xs mx-auto">
      <label className="text-lg font-semibold mb-4">
        {step === 1 ? "6자리 PIN을 입력하세요" : "다시 한 번 PIN을 입력하세요"}
      </label>
      <div className="flex gap-2 mb-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`w-6 h-6 sm:w-8 sm:h-8 border-b-2 text-2xl text-center ${
              value[i] ? "border-blue-500" : "border-gray-300"
            }`}
          >
            {value[i] ? "●" : ""}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3 w-full mb-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            type="button"
            className="py-4 rounded bg-gray-100 text-2xl font-bold active:bg-blue-200 transition"
            onClick={() => handleKey(String(n))}
            tabIndex={0}
          >
            {n}
          </button>
        ))}
        <div />
        <button
          type="button"
          className="py-4 rounded bg-gray-100 text-2xl font-bold active:bg-blue-200 transition"
          onClick={() => handleKey("0")}
          tabIndex={0}
        >
          0
        </button>
        <button
          type="button"
          className="py-4 rounded bg-gray-100 text-xl font-bold active:bg-red-200 transition"
          onClick={handleBackspace}
          tabIndex={0}
        >
          ⌫
        </button>
      </div>
      <button
        type="button"
        className="w-full py-3 rounded bg-blue-500 text-white font-bold hover:bg-blue-600 transition mb-2"
        onClick={handleSubmit}
      >
        {step === 1 ? "다음" : "확인"}
      </button>
      {error && <div className="text-red-500 text-sm">{error}</div>}
    </div>
  );
}
