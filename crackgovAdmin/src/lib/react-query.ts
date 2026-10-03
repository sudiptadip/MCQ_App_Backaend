import { QueryClient, type DefaultOptions } from '@tanstack/react-query';

const queryConfig: DefaultOptions = {
  queries: {
    // These are recommended defaults for production
    retry: 1, // Number of times to retry if request fails
    refetchOnWindowFocus: false, // Don't refetch when user switches back to browser tab
    staleTime: 1000 * 60 * 5, // Data stays fresh for 5 minutes
  },
};

export const queryClient = new QueryClient({ defaultOptions: queryConfig });
