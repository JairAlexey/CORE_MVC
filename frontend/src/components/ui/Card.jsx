export function Card({ children, className }) {
  return (
    <div className={`bg-[#2B2A2A] p-10 rounded-md ${className}`}>{children}</div>
  );
}

export default Card;
