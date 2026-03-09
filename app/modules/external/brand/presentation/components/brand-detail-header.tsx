import { Avatar, SocialLinks } from "~/core/design-system/components";

interface BrandDetailHeaderProps {
  brand: {
    name: string;
    logoUrl?: string;
    bannerUrl?: string;
    joinedSince?: string;
    description?: string;
    socialMedia?: any[];
  };
}

export function BrandDetailHeader({ brand }: BrandDetailHeaderProps) {
  return (
    <div className="relative mb-12">
      {/* Banner */}
      <div className="h-[200px] sm:h-[300px] lg:h-[400px] w-full bg-surface-alt relative overflow-hidden">
        {brand.bannerUrl ? (
          <img
            src={brand.bannerUrl}
            alt={`${brand.name} banner`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-surface-alt flex items-center justify-center text-text-tertiary">
            No Banner
          </div>
        )}
      </div>

      {/* Info Profile */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col sm:flex-row gap-6 items-start -mt-16 sm:-mt-20">
          {/* Logo */}
          <div className="p-2 bg-surface-primary rounded-full shrink-0">
            <Avatar
              src={brand.logoUrl}
              alt={brand.name}
              fallback={brand.name.charAt(0).toUpperCase()}
              size="xl"
              className="w-32 h-32 sm:w-40 sm:h-40 border-4 border-surface-primary"
            />
          </div>

          {/* Details */}
          <div className="flex-1 pt-2 sm:pt-24 pb-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-2">
              {brand.name}
            </h1>
            
            {brand.joinedSince && (
              <p className="text-text-tertiary mb-6">
                Bergabung sejak: {brand.joinedSince}
              </p>
            )}

            {brand.description && (
              <p className="text-text-secondary mb-8 max-w-3xl leading-relaxed">
                {brand.description}
              </p>
            )}

            {brand.socialMedia && brand.socialMedia.length > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-text-primary font-medium">Social Media</span>
                <SocialLinks links={brand.socialMedia} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
