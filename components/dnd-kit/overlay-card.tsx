'use client'

interface Props {
  label: string
}

export const OverlayCard = ({ label }: Props) => {
  return (
    <div className="w-full flex flex-col items-center justify-center bg-accent rounded-md cursor-grabbing p-8 shadow-2xl">
      {label}
    </div>
  )
}
