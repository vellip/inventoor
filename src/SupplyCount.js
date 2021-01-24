import { AiOutlineMinusCircle, AiOutlinePlusCircle } from 'react-icons/all'

function SupplyCount({ value, changeHandler }) {
  return (
    <div className="SupplyCount flex justify-center">
      <button onClick={() => changeHandler(value - 1)}>
        <AiOutlineMinusCircle size={20} />
      </button>
      <input
        type="number"
        onChange={(e) => changeHandler(e.target.value)}
        value={value}
        className="bg-transparent rounded-none border-b border-black mx-4 w-10 appearance-none text-xl text-center"
      />
      <button onClick={() => changeHandler(value + 1)}>
        <AiOutlinePlusCircle size={20} />
      </button>
    </div>
  )
}

export default SupplyCount
