import React from 'react';

const LoadingSpinner = ({ message = "로딩 중..." }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-white text-lg">{message}</p>
    </div>
  </div>
);

export default LoadingSpinner;