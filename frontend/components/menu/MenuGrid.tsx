'use client';

import { useState, useEffect } from 'react';
import { MenuItem, Category } from '@/lib/types';
import { menuService } from '@/lib/menu';
import { MenuItemCard } from './MenuItemCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

export function MenuGrid() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [itemsData, categoriesData] = await Promise.all([
          menuService.getMenuItems(),
          menuService.getCategories(),
        ]);
        
        setMenuItems(itemsData);
        setCategories(categoriesData);
        setFilteredItems(itemsData);
      } catch (error) {
        toast.error('Failed to load menu data');
        console.error('Error fetching menu data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...menuItems];

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filter by availability
    if (showOnlyAvailable) {
      filtered = filtered.filter(item => item.available);
    }

    setFilteredItems(filtered);
  }, [menuItems, searchQuery, selectedCategory, showOnlyAvailable]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Skeleton className="h-10 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="space-y-4">
              <Skeleton className="aspect-video w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('')}
          >
            All Categories
          </Button>
          {categories.map((category) => (
            <Button
              key={category._id}
              variant={selectedCategory === category.name ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(
                selectedCategory === category.name ? '' : category.name
              )}
            >
              {category.name}
            </Button>
          ))}
        </div>

        <Button
          variant={showOnlyAvailable ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Available Only
        </Button>
      </div>

      {/* Results Count */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary">
          {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} found
        </Badge>
        {selectedCategory && (
          <Badge variant="outline">
            Category: {selectedCategory}
          </Badge>
        )}
        {searchQuery && (
          <Badge variant="outline">
            Search: "{searchQuery}"
          </Badge>
        )}
      </div>

      {/* Menu Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No items found
          </h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filters or search query.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => (
            <MenuItemCard key={item._id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}