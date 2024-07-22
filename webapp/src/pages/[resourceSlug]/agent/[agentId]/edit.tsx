import { ChevronLeftIcon, PhotoIcon, UserCircleIcon } from '@heroicons/react/24/solid';
import Spinner from 'components/Spinner';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import * as API from '../../../../api';
import AgentForm from '../../../../components/AgentForm';
import { useAccountContext } from '../../../../context/account';

export default function EditAgent(props) {
	const [accountContext]: any = useAccountContext();
	const { teamName, account, csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { agent, models, tools } = state;

	async function fetchAgentData() {
		await API.getAgent(
			{
				resourceSlug,
				agentId: router.query.agentId
			},
			dispatch,
			setError,
			router
		);
	}

	useEffect(() => {
		fetchAgentData();
	}, [resourceSlug]);

	if (agent == null) {
		return <Spinner />;
	}

	return (
		<>
			<Head>
				<title>{`Edit Agent - ${teamName}`}</title>
			</Head>

			<div className='border-b pb-2 my-2 mb-6'>
				<h3 className='font-semibold text-gray-900'>Edit Agent</h3>
			</div>

			<span className='sm: w-full md:w-1/2 xl:w-1/3'>
				<AgentForm
					editing={true}
					agent={agent}
					models={models}
					tools={tools}
					fetchAgentFormData={fetchAgentData}
				/>
			</span>
		</>
	);
}

export async function getServerSideProps({
	req,
	res,
	query,
	resolvedUrl,
	locale,
	locales,
	defaultLocale
}) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}
