"use client";
import React, { FormEvent } from "react";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { useState } from "react";
import Image from "next/image";
import { addUserEmailToProduct } from "@/lib/actions";
import { useParams } from "next/navigation";

const Modal = () => {
  const params = useParams();

  const id = params.id as string;

  let [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e:FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    addUserEmailToProduct(id,email);
    setIsSubmitting(false);

    setEmail('');

    closeModal();


  }

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <>
      <button type="button" className="btn w-full" onClick={openModal}>
        Track
      </button>

      <Dialog open={isOpen} onClose={closeModal} className="relative z-50">
        <DialogBackdrop
          as="div"
          transition
          className="fixed inset-0 bg-black/30 transition duration-300 ease-in-out data-[closed]:opacity-0"
        />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel
            transition
            className="w-[448px] h-[370px] flex flex-col mx-auto rounded-lg bg-white p-6 shadow-xl transition duration-300 ease-in-out data-[closed]:scale-95 data-[closed]:opacity-0"
          >
            <div className="flex justify-between">
              <Image
                src="/assets/icons/logo.svg"
                alt="logo"
                width={28}
                height={28}
                className="border border-gray-200 rounded-full p-1.5 bg-white box-content"
              />

              <Image
                src="/assets/icons/x-close.svg"
                alt="close"
                width={18}
                height={18}
                onClick={closeModal}
                className="cursor-pointer"
              />
            </div>

            <div className="dialog-content">
              <div className="flex flex-col">
                <h4 className="dialog-head_text">
                  Stay updated with product pricing alerts right in your inbox!
                </h4>

                <p className="text-sm text-gray-600 mt-2">
                  Never miss a bargain again with our timely alerts!
                </p>

                <form className="flex flex-col mt-5" onSubmit={handleSubmit}>
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700"
                  >
                    Email Address
                  </label>
                  <div className="flex flex-gap border border-gray-300 rounded-full p-1 justify-center mt-2">
                    <Image
                      src="/assets/icons/mail.svg"
                      className="mr-3"
                      alt="mail"
                      width={18}
                      height={18}
                    />
                    <input
                      required
                      id="email"
                      placeholder="contact@jsmastery.pro"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="mt-4 mx-auto w-full">
                    <button disabled={isSubmitting} type="submit" className="btn w-full" >
                      {isSubmitting ? 'Submitting' : 'Track'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
};

export default Modal;
