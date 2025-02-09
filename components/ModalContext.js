import React, { createContext, useState, useContext } from 'react';

const ModalContext = createContext();

export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
    const [isModalVisible, setModalVisible] = useState(false);

    const toggleModal = () => setModalVisible(!isModalVisible);

    return (
        <ModalContext.Provider value={{ isModalVisible, toggleModal }}>
            {children}
        </ModalContext.Provider>
    );
};
