export default function HowItWorks() {
  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-8 lg:px-12 pt-28 sm:pt-32 md:pt-36 pb-12 sm:pb-16 md:pb-20 font-body relative z-10 flex flex-col items-center min-h-screen">
      <h1 className="font-headings text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-5 sm:mb-6 text-center leading-tight">
        How It Works
      </h1>
      <ul className="text-muted-foreground space-y-3 sm:space-y-4 max-w-lg w-full list-decimal list-inside text-sm sm:text-base leading-relaxed">
        <li>List Your Items - Add photos and descriptions of clothing you want to swap.</li>
        <li>Find a Match - Discover items from other members and send requests.</li>
        <li>Ship & Swap - Exchange directly with your peer.</li>
        <li>Refresh Your Style - Enjoy pre-loved garments at your doorstep.</li>
      </ul>
    </div>
  );
}
