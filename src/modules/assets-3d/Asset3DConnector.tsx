import React from 'react';
import Academic3DContentPanel, { Academic3DContentPanelProps } from './Academic3DContentPanel';

export type Asset3DConnectorProps = Academic3DContentPanelProps;

export default function Asset3DConnector(props: Asset3DConnectorProps) {
  return <Academic3DContentPanel {...props} />;
}
