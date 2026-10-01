'use client';

/**
 * Lets a custom page hand its (server-fetched) DRAFT design up to the store
 * layout during the editor's preview. Layouts can't read the URL's query
 * string, so the page — which can — fetches the draft and the layout picks it
 * up from here to theme the nav/footer/system styling the same way.
 */
import { createContext, useContext } from 'react';

const CustomDesignContext = createContext({ custom: null, setPreviewCustom: () => {} });

export const CustomDesignProvider = CustomDesignContext.Provider;
export const useCustomDesign = () => useContext(CustomDesignContext);
