const services = [
  {
    icon: 'fa-user-tie',
    title: 'Expert Advice',
    description: 'Get professional guidance from experienced real estate agents.',
    gradient: 'from-accent-blue/20 to-accent-blue/10',
    iconColor: 'text-accent-blue',
  },
  {
    icon: 'fa-search',
    title: 'Quick Search',
    description: 'Find your perfect property quickly with our search system.',
    gradient: 'from-accent-purple/20 to-accent-purple/10',
    iconColor: 'text-accent-purple',
  },
  {
    icon: 'fa-file-alt',
    title: 'Paperwork Help',
    description: 'Assistance with documentation and legal requirements.',
    gradient: 'from-accent-pink/20 to-accent-pink/10',
    iconColor: 'text-accent-pink',
  },
  {
    icon: 'fa-comments',
    title: 'Steady Communication',
    description: 'Stay informed with regular updates and responsive support.',
    gradient: 'from-accent-cyan/20 to-accent-cyan/10',
    iconColor: 'text-accent-cyan',
  },
];

export default function Services() {
  return (
    <section className="py-16 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => (
            <div
              key={service.title}
              className="glass-ultra rounded-2xl p-8 text-center hover:transform hover:-translate-y-2 transition-all"
            >
              <div
                className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${service.gradient} flex items-center justify-center`}
              >
                <i className={`fas ${service.icon} text-2xl ${service.iconColor}`}></i>
              </div>
              <h3 className="text-slate-800 font-semibold mb-3">{service.title}</h3>
              <p className="text-slate-400 text-sm">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
