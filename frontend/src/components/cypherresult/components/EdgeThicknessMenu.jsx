/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import style from './popover.module.scss';

const EdgeThicknessSettingModal = ({
  onSubmit,
  properties,
}) => {
  const [standardEdge, setStdEdge] = useState('');
  const [standardProperty, setStdProperty] = useState('');
  const [MinValue, setMinValue] = useState('');
  const [MaxValue, setMaxValue] = useState('');

  useEffect(() => {
    if (standardEdge === '') setStdProperty('');
  }, [standardEdge]);

  const edgeList = [...new Set(properties.map((p) => p.edge))];

  const propertyList = properties
    .filter((p) => p.edge === standardEdge)
    .map((p) => p.property);

  const apply = () => {
    if (!standardEdge || !standardProperty) return;
    const thickness = {
      edge: standardEdge,
      property: standardProperty,
      min: MinValue === '' ? 0 : Number(MinValue),
      max: MaxValue === '' ? 100 : Number(MaxValue),
    };
    onSubmit(thickness);
  };

  const reset = () => {
    onSubmit(null);
    setStdEdge('');
    setStdProperty('');
    setMinValue('');
    setMaxValue('');
  };

  return (
    <div className={style.panel}>
      <p className={style.title}>Apply Edge Weight</p>
      <select
        className={
          standardEdge === '' ? style.default : style.select
        }
        value={standardEdge}
        onChange={(e) => setStdEdge(e.target.value)}
      >
        <option value="">Select Edge</option>
        {edgeList.map((edge) => (
          <option key={edge} value={edge}>{edge}</option>
        ))}
      </select>
      <select
        className={
          standardProperty === '' ? style.default : style.select
        }
        value={standardProperty}
        onChange={(e) => setStdProperty(e.target.value)}
        disabled={!standardEdge}
      >
        <option value="">Select Property</option>
        {propertyList.map((prop) => (
          <option key={prop} value={prop}>{prop}</option>
        ))}
      </select>
      <div className={style.inputRow}>
        <input
          className={style.input}
          value={MinValue}
          onChange={(e) => {
            const v = e.target.value;
            if (v === '' || !Number.isNaN(Number(v))) {
              setMinValue(v === '' ? '' : Number(v));
            }
          }}
          placeholder="Min"
          type="number"
        />
        <input
          className={style.input}
          value={MaxValue}
          onChange={(e) => {
            const v = e.target.value;
            if (v === '' || !Number.isNaN(Number(v))) {
              setMaxValue(v === '' ? '' : Number(v));
            }
          }}
          placeholder="Max"
          type="number"
        />
      </div>
      <div className={style.buttons}>
        <button
          className={`${style.btn} ${style.btnSecondary}`}
          type="button"
          onClick={reset}
        >
          Reset
        </button>
        <button
          className={`${style.btn} ${style.btnPrimary}`}
          type="button"
          onClick={apply}
          disabled={!standardEdge || !standardProperty}
        >
          Apply
        </button>
      </div>
    </div>
  );
};

export default EdgeThicknessSettingModal;
