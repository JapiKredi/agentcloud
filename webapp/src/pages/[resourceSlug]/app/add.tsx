import * as API from '@api';
import { CheckBadgeIcon } from '@heroicons/react/24/outline';
import ChatAppForm from 'components/ChatAppForm';
import CrewAppForm from 'components/CrewAppForm';
import Spinner from 'components/Spinner';
import { useAccountContext } from 'context/account';
import { useStepContext } from 'context/stepwrapper';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

interface AddAppProps {
	apps: any[];
	tools: any[];
	agents: any[];
	tasks: any[];
	models: any[];
	datasources: any[];
}
const chatAppTaglines = [
	'Build single agent chat bots (like GPTS)',
	'Integrate RAG datasources',
	'Add custom agent',
	'Integrate custom tools',
	'Embed your chat app via IFrame'
];

const processAppTaglines = [
	'Build Multi-Agent Process Apps (powered by Crew AI)',
	'Integrate RAG datasources',
	'Add custom code tools',
	'Add tasks',
	'Embed your process app via IFrame'
];

export default function AddApp(props: AddAppProps) {
	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { step, setStep }: any = useStepContext();
	const { apps, tools, agents, tasks, models, datasources } = state;

	async function fetchAppFormData() {
		await API.getApps({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchAppFormData();
	}, [resourceSlug]);

	if (apps == null) {
		return <Spinner />;
	}
	const handleCreateChatApp = () => {
		setStep(1);
	};

	const handleCreateProcessApp = () => {
		setStep(2);
	};

	const renderStepContent = () => {
		switch (step) {
			case 0:
				return (
					<div>
						<h1 className='text-gray-900 font-semibold text-xl sm:text-2xl dark:text-white'>
							Build Intelligent Chat and Process Apps
						</h1>
						<h2 className='text-gray-400 text-sm sm:text-base mt-2 dark:text-gray-50'>
							Easily Build Intelligent Chat and Process Apps to Streamline Your Workflow
						</h2>
						<div className='md:flex gap-8 w-full mt-10'>
							<div className='flex-1 border border-gray-200 dark:border-slate-700 p-4 rounded-md group dark:bg-slate-800'>
								<img src='/images/get-started/create-chat-app.png' alt='Create Chat App' />
								<div className='flex flex-col md:flex-row border-t border-gray-200 dark:border-slate-700 pt-4'>
									<div className='flex'>
										<img
											src='/images/get-started/chat-app-square.png'
											className='aspect-square h-12'
										/>
										<div className='ml-2'>
											<div className='text-lg font-semibold text-gray-900 dark:text-white'>
												Chat App
											</div>
											<div className='text-gray-500 max-w-sm dark:text-gray-50'>
												Build your chat app effortlessly with intelligent agents handling
												conversations
											</div>
										</div>
									</div>

									<button
										className='w-full md:w-24 h-9 disabled:bg-primary-200 group-hover:bg-primary-500 group-hover:text-white rounded-lg flex justify-center items-center text-sm mt-4 md:mt-auto max-w-sm border border-gray-200 dark:text-white ml-auto'
										onClick={handleCreateChatApp}
									>
										+ Create
									</button>
								</div>
								<div className='flex flex-col md:flex-row gap-4 flex-wrap mt-4'>
									{chatAppTaglines.map((tagline, index) => (
										<TagLine key={index} tagline={tagline} />
									))}
								</div>
							</div>

							<div className='flex-1 border border-gray-200 dark:border-slate-700 p-4 rounded-md group dark:bg-slate-800'>
								<img src='/images/get-started/create-process-app.png' alt='Create Process App' />
								<div className='flex flex-col md:flex-row border-t border-gray-200 dark:border-slate-700 pt-4'>
									<div className='flex'>
										<img
											src='/images/get-started/process-app-square.png'
											className='aspect-square h-12'
										/>
										<div className='ml-2'>
											<div className='text-lg font-semibold text-gray-900 dark:text-white'>
												Process App
											</div>
											<div className='text-gray-500 max-w-sm dark:text-gray-50'>
												Effortlessly organize tasks and automate them with intelligent agents.
											</div>
										</div>
									</div>

									<button
										className='w-full md:w-24 h-9 disabled:bg-primary-200 group-hover:bg-primary-500 group-hover:text-white rounded-lg flex justify-center items-center text-sm mt-4 md:mt-auto max-w-sm border border-gray-200 dark:text-white ml-auto'
										onClick={handleCreateProcessApp}
									>
										+ Create
									</button>
								</div>
								<div className='flex flex-col md:flex-row gap-4 flex-wrap mt-4'>
									{processAppTaglines.map((tagline, index) => (
										<TagLine key={index} tagline={tagline} />
									))}
								</div>
							</div>
						</div>
					</div>
				);
			case 1:
				return (
					<ChatAppForm
						fetchFormData={fetchAppFormData}
						agentChoices={agents}
						modelChoices={models}
						toolChoices={tools}
					/>
				);
			case 2:
				return (
					<CrewAppForm
						agentChoices={agents}
						taskChoices={tasks}
						modelChoices={models}
						fetchFormData={fetchAppFormData}
					/>
				);
			default:
				return null;
		}
	};

	return (
		<>
			<Head>
				<title>{`New App - ${teamName}`}</title>
			</Head>
			{renderStepContent()}
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

const TagLine = ({ tagline }: { tagline: string }) => {
	return (
		<div className='flex text-gray-900 items-center p-1 bg-primary-50 rounded gap-1 w-fit dark:bg-gray-600 dark:text-white'>
			<CheckBadgeIcon className='h-6 w-6' />
			<div>{tagline}</div>
		</div>
	);
};
