function Modal({ children, shown }) {
  return shown ? (
    <div className="Modal flex content-center justify-center z-10 fixed top-0 bottom-0 right-0 left-0 bg-gray-600 bg-opacity-75">
      <div className="container m-auto w-max bg-gray-100 p-10 relative">{children}</div>
    </div>
  ) : null
}

export default Modal
