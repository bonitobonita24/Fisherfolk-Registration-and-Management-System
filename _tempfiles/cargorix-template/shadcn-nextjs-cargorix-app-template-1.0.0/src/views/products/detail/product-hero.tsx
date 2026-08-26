'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { BookmarkIcon, BoxIcon, LayoutGridIcon, Maximize2Icon, ScanBarcodeIcon, TagIcon } from 'lucide-react'

// Type Imports
import type { Product } from '@/types/entities/product'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

// Util Imports
import { cn } from '@/lib/utils'

// Data Imports
import { PRODUCT_LIFECYCLE_STATUS_BADGE } from '../product-badges'

type ProductHeroProps = {
  product: Product
}

const ProductHero = ({ product }: ProductHeroProps) => {
  // Vars
  const gallery = product.galleryImages.length > 0 ? product.galleryImages : [product.primaryImage]
  const statusBadge = PRODUCT_LIFECYCLE_STATUS_BADGE[product.status]

  const meta: { label: string; value: string; icon: typeof TagIcon }[] = [
    { label: 'SKU', value: product.sku || '—', icon: TagIcon },
    { label: 'Barcode', value: product.barcode || '—', icon: ScanBarcodeIcon },
    { label: 'Category', value: product.category, icon: LayoutGridIcon },
    { label: 'Brand', value: product.brand || '—', icon: BookmarkIcon },
    { label: 'Unit', value: product.unit, icon: BoxIcon }
  ]

  // States
  const [selected, setSelected] = useState(0)

  const activeImage = gallery[selected] ?? product.primaryImage

  return (
    <div className='flex flex-col gap-6 md:flex-row'>
      <div className='relative aspect-square w-full max-w-72 shrink-0 overflow-hidden rounded-2xl border max-md:mx-auto lg:size-80 lg:max-w-none'>
        <img src={activeImage} alt={product.name} className='size-full object-cover' />
        <Dialog>
          <DialogTrigger
            render={
              <Button
                variant='secondary'
                size='icon'
                className='bg-background/80 absolute top-3 right-3 rounded-full backdrop-blur-sm'
                aria-label='Enlarge image'
              />
            }
          >
            <Maximize2Icon className='size-4' />
          </DialogTrigger>
          <DialogContent className='sm:max-w-2xl'>
            <DialogTitle className='sr-only'>{product.name} images</DialogTitle>
            <Carousel opts={{ startIndex: selected, loop: gallery.length > 1 }} className='w-full'>
              <CarouselContent>
                {gallery.map((image, index) => (
                  <CarouselItem key={image + index}>
                    <div className='aspect-square overflow-hidden rounded-xl'>
                      <img src={image} alt={`${product.name} ${index + 1}`} className='size-full object-cover' />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {gallery.length > 1 && (
                <>
                  <CarouselPrevious className='left-3' />
                  <CarouselNext className='right-3' />
                </>
              )}
            </Carousel>
          </DialogContent>
        </Dialog>
      </div>

      <div className='flex min-w-0 flex-1 flex-col justify-between gap-6'>
        <div className='space-y-3'>
          <div>
            <div className='flex flex-wrap items-center gap-3'>
              <h1 className='text-3xl font-bold tracking-tight'>{product.name}</h1>
              <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
            </div>
            <p className='text-muted-foreground mt-2 max-w-2xl text-sm'>{product.description}</p>
          </div>
          <div className='flex max-w-md flex-wrap gap-4'>
            {meta.map(field => {
              const Icon = field.icon

              return (
                <div key={field.label} className='flex items-center gap-2.5'>
                  <span className='bg-muted text-muted-foreground grid size-8 shrink-0 place-items-center rounded-lg'>
                    <Icon className='size-4' />
                  </span>
                  <div className='min-w-0'>
                    <p className='text-muted-foreground text-xs'>{field.label}</p>
                    <p className='truncate text-sm font-medium'>{field.value}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {gallery.length > 1 && (
          <Carousel opts={{ align: 'start', dragFree: true }} className='w-full max-w-md max-md:order-0 md:order-3'>
            <CarouselContent className='-ml-2'>
              {gallery.map((image, index) => (
                <CarouselItem key={image + index} className='basis-auto pl-2'>
                  <Button
                    variant='ghost'
                    onClick={() => setSelected(index)}
                    aria-label={`Show image ${index + 1} of ${gallery.length}`}
                    className={cn(
                      'size-20 overflow-hidden rounded-xl border-2 p-0',
                      index === selected ? 'border-primary' : 'hover:border-border border-transparent'
                    )}
                  >
                    <img
                      src={image}
                      alt={`${product.name} thumbnail ${index + 1}`}
                      className='size-full object-cover'
                    />
                  </Button>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        )}
      </div>
    </div>
  )
}

export default ProductHero
