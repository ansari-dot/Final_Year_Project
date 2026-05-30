export default function ContactUs() {
  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-8 lg:px-12 pt-28 sm:pt-32 md:pt-36 pb-12 sm:pb-16 md:pb-20 font-body relative z-10 flex flex-col items-center min-h-screen">
      <h1 className="font-headings text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-4 sm:mb-6 text-center leading-tight">
        Contact Us
      </h1>
      <p className="text-muted-foreground text-center text-sm sm:text-base mb-8 sm:mb-10 leading-relaxed max-w-xl">
        Have questions or feedback? We'd love to hear from you.
        Fill out the form below and we'll be in touch!
      </p>
      <form className="w-full max-w-md space-y-4 sm:space-y-5">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-primary mb-1.5 sm:mb-2">Name</label>
          <input type="text" className="w-full px-4 py-3 sm:py-3.5 bg-input border border-border rounded-lg outline-none focus:border-accent text-sm sm:text-base" />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-primary mb-1.5 sm:mb-2">Email</label>
          <input type="email" className="w-full px-4 py-3 sm:py-3.5 bg-input border border-border rounded-lg outline-none focus:border-accent text-sm sm:text-base" />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-primary mb-1.5 sm:mb-2">Message</label>
          <textarea rows={4} className="w-full px-4 py-3 sm:py-3.5 bg-input border border-border rounded-lg outline-none focus:border-accent resize-none text-sm sm:text-base"></textarea>
        </div>
        <button type="button" className="w-full px-5 py-3.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          Send Message
        </button>
      </form>
    </div>
  );
}
