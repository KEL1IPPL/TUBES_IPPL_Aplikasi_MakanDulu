import React from 'react';
import { AuthFlow } from '../hooks/useAuthFlow';
import { BuyerRegistrationForm } from './BuyerRegistrationForm';
import { SellerRegistrationForm } from './SellerRegistrationForm';

interface Props {
  auth: AuthFlow;
  userRole: 'Pembeli' | 'Penjual';
  showToast: (title: string, message: string, isError?: boolean) => void;
}

export const RegistrasiPengguna: React.FC<Props> = ({ auth, userRole, showToast }) => {
  const setBuyerField = (field: string, value: string) => {
    const setters: Record<string, (value: string) => void> = {
      name: auth.setCustName,
      email: auth.setCustEmail,
      password: auth.setCustPassword,
      phone: auth.setCustPhone,
      address: auth.setCustAddress,
    };
    setters[field]?.(value);
  };

  const setSellerField = (field: string, value: string) => {
    const setters: Record<string, (value: string) => void> = {
      owner: auth.setMerchOwner,
      store: auth.setMerchStoreName,
      email: auth.setMerchEmail,
      password: auth.setMerchPassword,
      phone: auth.setMerchPhone,
      address: auth.setMerchStoreAddress,
    };
    setters[field]?.(value);
  };

  if (userRole === 'Pembeli') {
    return (
      <BuyerRegistrationForm
        userRole={userRole}
        isSubmitting={auth.isSubmitting}
        setAuthMode={auth.setAuthMode}
        setAlertBanner={auth.setAlertBanner}
        values={{
          name: auth.custName,
          email: auth.custEmail,
          password: auth.custPassword,
          phone: auth.custPhone,
          address: auth.custAddress,
        }}
        onChange={setBuyerField}
        onSubmit={auth.handleBuyerRegistration}
      />
    );
  }

  return (
    <SellerRegistrationForm
      userRole={userRole}
      isSubmitting={auth.isSubmitting}
      setAuthMode={auth.setAuthMode}
      setAlertBanner={auth.setAlertBanner}
      values={{
        owner: auth.merchOwner,
        store: auth.merchStoreName,
        email: auth.merchEmail,
        password: auth.merchPassword,
        phone: auth.merchPhone,
        address: auth.merchStoreAddress,
      }}
      files={{
        nib: auth.uploadedNib,
        ktp: auth.uploadedKtp,
        npwp: auth.uploadedNpwp,
      }}
      onChange={setSellerField}
      onFile={(field, value) => {
        const setters: Record<string, (value: string) => void> = {
          nib: auth.setUploadedNib,
          ktp: auth.setUploadedKtp,
          npwp: auth.setUploadedNpwp,
        };
        setters[field]?.(value);
      }}
      onSubmit={auth.handleSellerRegistration}
      showToast={showToast}
    />
  );
};
