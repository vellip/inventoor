function Suggestions({ suggestions, clickHandler }) {
  return (
    <div className="Suggestions ">
      <ul>
        {suggestions.map((item) => (
          <li className="mb-2" key={item}>
            <button
              onClick={() => clickHandler(item)}
              className="px-4 py-3 bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              {item}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Suggestions
