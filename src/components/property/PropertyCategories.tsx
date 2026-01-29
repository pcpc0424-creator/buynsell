import Link from 'next/link';

const categories = [
  {
    type: 'house',
    href: '/properties/house',
    icon: 'fa-home',
    label: 'House',
    gradient: 'from-blue-500/20 to-blue-600/30',
    iconColor: 'text-blue-400',
  },
  {
    type: 'condo',
    href: '/properties/condo',
    icon: 'fa-building',
    label: 'Condominium',
    gradient: 'from-purple-500/20 to-purple-600/30',
    iconColor: 'text-purple-400',
  },
  {
    type: 'townhouse',
    href: '/properties/townhouse',
    icon: 'fa-city',
    label: 'Townhouse',
    gradient: 'from-pink-500/20 to-pink-600/30',
    iconColor: 'text-pink-400',
  },
  {
    type: 'commercial',
    href: '/properties/commercial',
    icon: 'fa-store',
    label: 'Commercial',
    gradient: 'from-amber-500/20 to-amber-600/30',
    iconColor: 'text-amber-400',
  },
  {
    type: 'lot',
    href: '/properties/lot',
    icon: 'fa-map',
    label: 'Lot',
    gradient: 'from-green-500/20 to-green-600/30',
    iconColor: 'text-green-400',
  },
  {
    type: 'new-development',
    href: '/properties/new-development',
    icon: 'fa-hammer',
    label: 'New Development',
    gradient: 'from-cyan-500/20 to-cyan-600/30',
    iconColor: 'text-cyan-400',
  },
];

interface PropertyCategoriesProps {
  activeType?: string;
}

export default function PropertyCategories({ activeType }: PropertyCategoriesProps) {
  return (
    <section className="pt-32 pb-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => {
            const isActive = activeType === category.type;
            return (
              <Link
                key={category.href}
                href={category.href}
                className={`category-card group ${isActive ? 'active' : ''}`}
              >
                <div className={`glass-ultra rounded-2xl p-6 text-center ${isActive ? 'bg-accent-blue/10 border-accent-blue/30' : ''}`}>
                  <div
                    className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center group-hover:scale-110 transition-all duration-500`}
                  >
                    <i className={`fas ${category.icon} text-2xl ${category.iconColor}`}></i>
                  </div>
                  <h3 className="font-medium text-white text-sm">{category.label}</h3>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
